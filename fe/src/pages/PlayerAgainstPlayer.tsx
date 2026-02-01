import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Chess, Move, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from '@heroui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar } from '@heroui/avatar';
import { ProfileLogo } from '@/components/icons';
import MainLayout from '@/layouts/main';

interface ProfileResponse {
    message: string;
    profile?: {
        nickname: string;
        avatar: string;
        rating?: number;
        country?: string;
    };
}

const ChessGame = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const navigate = useNavigate();
    const goToHomepage = () => { navigate('/'); };
    const [status, setStatus] = useState<string>('Connecting...');
    const [color, setColor] = useState<string | null>(null);
    const [gameRoom, setGameRoom] = useState<string | null>(null);
    const [game, setGame] = useState(new Chess());
    const [whiteWins, setWhiteWin] = useState(false);
    const [blackWins, setBlackWin] = useState(false);
    const [stalemate, setStalemate] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [shareableLink, setShareableLink] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('null');
    const [rating, setRating] = useState<number>(0);
    const [country, setCountry] = useState<string>('');
    const [opponentNickname, setOpponentNickname] = useState<string>('Waiting for opponent...');
    const [opponentAvatar, setOpponentAvatar] = useState<string>('null');
    const [opponentRating, setOpponentRating] = useState<number>(-1);
    const [opponentCountry, setOpponentCountry] = useState<string>('');

    useEffect(() => {
        // Fetch player profile
        const fetchProfile = async () => {
            const token = localStorage.getItem('JWT');
            try {
                const response = await axios.get<ProfileResponse>('http://localhost:8000/profiles/myprofile', {
                    headers: {
                        Authorization: 'Bearer ' + token,
                    }
                });

                if (response?.data?.profile) {
                    setNickname(response.data.profile.nickname);
                    setAvatar(response.data.profile.avatar);
                    setRating(response.data.profile.rating || 0);
                    setCountry(response.data.profile.country || '');
                } else {
                    console.log('Error fetching profile:', response?.data?.message);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchProfile();

        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room');
        if (roomFromUrl) {
            setGameRoom(roomFromUrl);
            setStatus('Joining game...');
        }

        const newSocket: Socket = io('http://localhost:8000', {
            path: '/chess/socket.io',
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected:', newSocket.id);
            if (roomFromUrl) {
                newSocket.emit('joinRoom', { room: roomFromUrl });
            } else {
                setStatus('Creating game room...');
            }
        });

        newSocket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setStatus('Failed to connect to server');
        });

        newSocket.on('error', (data) => {
            console.error('Server error:', data);
            setStatus(data.message);
        });

        newSocket.on('roomCreated', (data) => {
            console.log('Room created:', data);
            setGameRoom(data.room);
            setStatus('Waiting for opponent...');
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('room', data.room);
            window.history.pushState({}, '', newUrl.toString());
            setShareableLink(newUrl.toString());
        });

        newSocket.on('gameStart', (data) => {
            if (data.white === data.black) {
                console.error('Error: Same player assigned as both White and Black');
                setStatus('Error: Invalid game setup');
                return;
            }
            const playerColor = data.white === newSocket.id ? 'White' : 'Black';
            setColor(playerColor);
            setGameRoom(data.room);
            setGame(new Chess(data.fen));
            setWhiteWin(false);
            setBlackWin(false);
            setStalemate(false);
            setStatus(`Playing as ${playerColor}`);
            setGameStarted(true);

            // Send JWT token to server
            const token = localStorage.getItem('JWT');
            if (token && data.room) {
                newSocket.emit('submitJWT', { room: data.room, token });
            } else {
                console.error('No JWT token found or room missing');
                setStatus('Authentication error: No token found');
            }
        });

        newSocket.on('jwtValidated', (data) => {
            console.log('JWT validated:', data);
            setStatus(`Playing as ${color} (Authenticated)`);
            
            if (data.room) {
                console.log('Room from JWT validation:', data.room);
                
                let profileReceived = false;
                
                const tryGetOpponentProfile = (attempts = 0) => {
                    if (attempts >= 3) {
                        if (!profileReceived) {
                            setStatus('Failed to get opponent data');
                        }
                        return;
                    }
                    
                    console.log(`Requesting opponent profile (attempt ${attempts + 1})...`);
                    newSocket.emit('getOpponentProfile', { room: data.room });
                    
                    setTimeout(() => {
                        if (!profileReceived) {
                            tryGetOpponentProfile(attempts + 1);
                        }
                    }, 1500);
                };
                
                const onOpponentProfile = (profileData: any) => {
                    profileReceived = true;
                    console.log('Opponent profile received:', profileData);
                    if (profileData.nickname) {
                        setOpponentNickname(profileData.nickname);
                    }
                    if (profileData.avatar) {
                        setOpponentAvatar(profileData.avatar);
                    }
                    if (profileData.rating) {
                        setOpponentRating(profileData.rating);
                    }
                    if (profileData.country) {
                        setOpponentCountry(profileData.country);
                    }
                    newSocket.off('opponentProfile', onOpponentProfile);
                };
                
                newSocket.on('opponentProfile', onOpponentProfile);
                tryGetOpponentProfile();
            }
        });

        newSocket.on('move', (data) => {
            console.log(`[${newSocket.id}] Move received:`, data);
            try {
                const gameCopy = new Chess(data.fen);
                setGame(gameCopy);
                if (gameCopy.isStalemate()) {
                    console.log(`[${newSocket.id}] Game is stalemate`);
                    setStalemate(true);
                }
                if (gameCopy.isCheckmate()) {
                    if (gameCopy.turn() === 'b') {
                        console.log(`[${newSocket.id}] White wins`);
                        setWhiteWin(true);
                    } else if (gameCopy.turn() === 'w') {
                        console.log(`[${newSocket.id}] Black wins`);
                        setBlackWin(true);
                    }
                }
            } catch (error) {
                console.error(`[${newSocket.id}] Error applying move:`, error, data);
                setStatus('Error applying move');
            }
        });

        newSocket.on('opponentProfile', (data) => {
            console.log('Opponent profile received:', data);
            if (data.nickname) {
                setOpponentNickname(data.nickname);
            }
            if (data.avatar) {
                setOpponentAvatar(data.avatar);
            }
            if (data.rating) {
                setOpponentRating(data.rating);
            }
            if (data.country) {
                setOpponentCountry(data.country);
            }
        });

        newSocket.on('gameReset', (data) => {
            console.log(`[${newSocket.id}] Game reset:`, data);
            setGame(new Chess(data.fen));
            setWhiteWin(false);
            setBlackWin(false);
            setStalemate(false);
            setStatus(`Playing as ${color}`);
        });

        newSocket.on('opponentDisconnected', (data) => {
            console.log('Opponent disconnected:', data);
            setStatus(data.message);
            setColor(null);
            setGameRoom(null);
            setGame(new Chess());
            setWhiteWin(false);
            setBlackWin(false);
            setStalemate(false);
            setShareableLink('');
            setOpponentNickname('Opponent left the game');
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('room');
            window.history.pushState({}, '', newUrl.toString());
        });

        return () => {
            console.log('useEffect cleanup: Disconnecting socket');
            newSocket.disconnect();
        };
    }, []);

    const makeAMove = (move: { from: string; to: string; promotion?: string }): Move | null => {
        if (!socket || !gameRoom || !color) {
            console.error('Cannot make move: socket, gameRoom, or color missing');
            setStatus('Game not initialized');
            return null;
        }
        const isWhiteTurn = game.turn() === 'w';
        const isPlayerTurn = (color === 'White' && isWhiteTurn) || (color === 'Black' && !isWhiteTurn);
        if (!isPlayerTurn) {
            console.log('Not your turn:', { color, isWhiteTurn });
            setStatus('Not your turn!');
            return null;
        }

        try {
            const gameCopy = new Chess(game.fen());
            const moveToApply = { ...move };
            if (!moveToApply.promotion || !['q', 'r', 'b', 'n'].includes(moveToApply.promotion)) {
                delete moveToApply.promotion;
            }
            const result = gameCopy.move(moveToApply);
            if (result) {
                console.log(`[${socket.id}] Move made locally:`, moveToApply, 'FEN:', gameCopy.fen());
                setGame(gameCopy);
                socket.emit('move', { room: gameRoom, move: moveToApply });
                return result;
            } else {
                console.error(`[${socket.id}] Invalid move:`, moveToApply);
                setStatus('Invalid move');
                return null;
            }
        } catch (error) {
            console.error(`[${socket.id}] Error making move:`, error, move);
            setStatus('Error making move');
            return null;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
        const piece = game.get(sourceSquare as Square);
        let promotion: string | undefined = undefined;
        if (
            piece &&
            piece.type === 'p' &&
            ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1'))
        ) {
            promotion = 'q';
        }

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion,
        });
        return !!move;
    };

    const copyLinkToClipboard = () => {
        if (shareableLink) {
            navigator.clipboard.writeText(shareableLink);
            setStatus('Link copied to clipboard');
            setTimeout(() => {
                setStatus(`Playing as ${color}`);
            }, 2000);
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="flex justify-between w-full mb-4">
                        {/* Current player info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12">
                                {avatar === 'null' ? (
                                    <ProfileLogo className="w-full h-full" />
                                ) : (
                                    <Avatar
                                        className="w-full h-full"
                                        src={avatar}
                                        alt="Player Avatar"
                                        showFallback
                                        isBordered
                                    />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold">You: {nickname || 'Loading...'}</p>
                                <div className="flex gap-2 text-sm">
                                    <span>Rating: {rating}</span>
                                    {country && <span>| {country}</span>}
                                </div>
                                {color && <p className="text-sm">Playing as: {color}</p>}
                            </div>
                        </div>
                        {/* Opponent info */}
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="font-semibold text-right">Opponent: {opponentNickname}</p>
                                <div className="flex gap-2 text-sm justify-end">
                                    {opponentRating > -1 && <span>Rating: {opponentRating}</span>}
                                    <span>| {opponentCountry}</span>
                                </div>
                                {color && <p className="text-sm text-right">Playing as: {color === 'White' ? 'Black' : 'White'}</p>}
                            </div>
                            <div className="w-12 h-12">
                                {opponentAvatar === 'null' ? (
                                    <ProfileLogo className="w-full h-full" />
                                ) : (
                                    <Avatar
                                        className="w-full h-full"
                                        src={opponentAvatar}
                                        alt="Opponent Avatar"
                                        showFallback
                                        isBordered
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {shareableLink && !gameStarted && (
                        <div className="my-4 flex flex-row items-center align-center gap-x-4">
                            <p>Share this link to invite a player:</p>
                            <input
                                type="text"
                                value={shareableLink}
                                readOnly
                                className="border p-2 w-full"
                            />
                            <Button
                                size="sm"
                                radius="lg"
                                className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
                                onPress={copyLinkToClipboard}
                            >
                                Copy Link
                            </Button>
                        </div>
                    )}
                    
                    <div className="text-2xl font-bold mb-4">
                        {whiteWins && 'White wins!'}
                        {blackWins && 'Black wins!'}
                        {stalemate && "It's a tie!"}
                    </div>
                    
                    <div className="w-[800px] border-5 border-zinc-400">
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={onDrop}
                            boardOrientation={color === 'Black' ? 'black' : 'white'}
                        />
                    </div>
                    
                    <Button
                        size="lg"
                        radius="lg"
                        className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
                        onPress={goToHomepage}
                    >
                        Back to Homepage
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
};

export default ChessGame;