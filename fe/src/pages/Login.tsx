import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Link } from "@heroui/link";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "@/contexts/UserContext";
import React from "react";
import AuthChessboardPattern from "@/components/AuthChessboardPattern";
import { login } from "@/services/authApi";

const authInputClassNames = {
    input: "text-zinc-900 placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-300",
};

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [password, setPassword] = React.useState<string>("");
    const [email, setEmail] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [isErrorVisible, setIsErrorVisible] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<string>("");

    const { getAvatarUrl } = useUserContext();

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setIsLoading(true);
        setIsErrorVisible(false);

        try {
            const response = await login({
                email,
                password,
            });
            console.log("Gautas res: " + response);

            if (response?.data?.token) {
                localStorage.setItem("JWT", response.data.token);
                navigate("/");
                console.log(response);
                getAvatarUrl();
                window.location.reload();
            } else {
                setErrorMessage(response?.data?.message || "An internal server error occured");
                setIsErrorVisible(true);
            }

        } catch (error: any) {
            console.log(error.response?.data?.message);
            setErrorMessage(error.response?.data?.message || "An internal server error occured");
            setIsErrorVisible(true);
        } finally {
            setIsLoading(false);
        }

    }

    return (
        <div className="relative flex flex-col w-full min-h-screen md:flex-row">
            <div className="items-center justify-center hidden h-full overflow-hidden bg-blue-500 md:w-2/5 md:flex">
                <AuthChessboardPattern />
            </div>
            <div className="min-h-screen w-full md:w-3/5 bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center md:shadow-[-10px_0_15px_rgba(0,0,0,0.2)] md:absolute md:right-0 md:z-10">
                <div className="pt-5 text-3xl font-semibold text-center text-stone-700 dark:text-white">
                    Welcome to <span className="text-4xl font-bold text-emerald-500">Chess</span>
                </div>
                <Form
                    className="min-h-full w-[400px] flex flex-col items-center justify-center gap-y-8 py-20"
                    autoComplete="off"
                >
                    <Input
                        aria-label="Email"
                        placeholder="Enter your email"
                        classNames={authInputClassNames}
                        size="md"
                        radius="md"
                        variant="bordered"
                        type="email"
                        value={email}
                        onValueChange={setEmail}
                        autoComplete="off"
                    />
                    <Input
                        aria-label="Password"
                        placeholder="Enter your password"
                        classNames={authInputClassNames}
                        size="md"
                        radius="md"
                        variant="bordered"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onValueChange={setPassword}
                        autoComplete="new-password"
                    />
                    <Button
                        isLoading={isLoading}
                        size="lg"
                        radius="lg"
                        className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
                        onPress={handleSubmit}
                    >
                        Log in
                    </Button>
                    <Button
                        isLoading={isLoading}
                        size="lg"
                        radius="lg"
                        className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
                        onPress={() => setShowPassword(showPassword => showPassword ? false : true) }
                    >
                        {showPassword ? "Hide password" : "Show password"}
                    </Button>
                    <Link
                        className="flex items-center justify-start gap-1"
                        color="foreground"
                        href="/register"
                    >
                        <span className="text-zinc-700 dark:text-zinc-300">Don't have an account yet?</span>
                    </Link>
                    {isErrorVisible &&
                    <Alert
                        title="Could not sign in"
                        description={errorMessage}
                        isVisible={isErrorVisible}
                        onClose={() => setIsErrorVisible(false)}
                        radius="md"
                        color="danger"
                        variant="solid"
                        >
                    </Alert>}
                </Form>
            </div>
        </div>
    );
}

export default Login;
