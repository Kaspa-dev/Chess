import { useUserContext } from "@/contexts/UserContext";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const { resetAvatar } = useUserContext();

    const revokeJWT = () => {
        localStorage.removeItem("JWT");
        navigate("/login");
        resetAvatar();
        window.location.reload();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-y-10 min-w-screen">
            <p className="font-sans text-3xl font-semibold text-stone-700">
                You will be <span className="text-emerald-500">logged out</span>. Are you sure you want to continue?
            </p>
            <div className="flex flex-row items-center justify-center w-1/2 gap-x-5">
                <Button
                    size="lg"
                    radius="full"
                    className="w-1/6 font-semibold text-white shadow-lg bg-stone-700"
                    onPress={revokeJWT}
                >
                    Yes
                </Button>
                <Button
                    size="lg"
                    radius="full"
                    className="w-5/12 font-semibold text-black shadow-lg bg-emerald-500"
                    onPress={() => navigate(-1)}
                >
                    No, go back
                </Button>
            </div>
        </div>
    );
}

export {Logout}