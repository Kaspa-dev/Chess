import { Button, PressEvent } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import React from "react";
import { validateEmail, validateEmailLength, validatePassword, validatePasswordLength, validatePasswordMatch } from "../utils/login";
import axios from "axios";
import { Alert } from "@heroui/alert";
import { Link } from "@heroui/link";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from 'react-router-dom'
import { useUserContext } from "@/contexts/UserContext";
interface RegisterResponse {
    message: string,
    token?: string,
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [emailError, setEmailError] = React.useState<boolean>(false);
  const [emailLengthError, setEmailLengthError] = React.useState<boolean>(false);
  const [passwordError, setPasswordError] = React.useState<boolean>(false);
  const [passwordLengthError, setPasswordLengthError] = React.useState<boolean>(false);
  const [passwordConfirmError, setPasswordConfirmError] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isErrorVisible, setIsErrorVisible] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [alertTitle, setAlertTitle] = React.useState<string>("Could not create an account");
  const [alertColor, setAlertColor] = React.useState<"danger" | "success" | undefined>("danger");

  const [searchParams, setSearchParams] = useSearchParams();
  var token = searchParams.get("token");
  const navigate = useNavigate();
  const hasRun = React.useRef(false);
  const { getAvatarUrl } = useUserContext();

    React.useEffect(() => {
        async function registration() {
            console.log("token = " + token);
            console.log("local storage token = " + localStorage.getItem("verification"));
            if (token != null && localStorage.getItem("verification") == token) {
                try {
                    const Email = localStorage.getItem("email");
                    const Pass = localStorage.getItem("pass");
                    const response = await axios.post<RegisterResponse | undefined>("http://localhost:8000/authentication/register", {
                        email : Email,
                        password: Pass,
                    })
                    console.log("Gautas res: " + response);

                    if (response?.data?.token) {
                        localStorage.setItem("JWT", response.data.token);
                        localStorage.removeItem("verification");
                        localStorage.removeItem("email");
                        localStorage.removeItem("pass");
                        navigate("/editprofile");
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
        }

        if (hasRun.current) return;
        hasRun.current = true;
        registration();
        localStorage.removeItem("verification");
        localStorage.removeItem("email");
        localStorage.removeItem("pass");
    }, []);

  const handleSubmit = async (e: PressEvent) => {

    localStorage.removeItem("verification");
    localStorage.removeItem("email");
    localStorage.removeItem("pass");
    setAlertTitle("Could not create an account");
    setAlertColor("danger");
    setIsLoading(true);
    setIsErrorVisible(false);

    const emailValidLength = validateEmailLength(email);
    const emailValid = emailValidLength ? validateEmail(email) : true;
    const passwordLength = validatePasswordLength(password);
    const passwordValid = passwordLength ? validatePassword(password) : true
    const passwordConfirmValid = validatePasswordMatch(password, passwordConfirm);

    setEmailLengthError(!emailValidLength);
    setEmailError(!emailValid);
    setPasswordLengthError(!passwordLength);
    setPasswordError(!passwordValid);
    setPasswordConfirmError(!passwordConfirmValid);

    if(!emailValidLength || !emailValid || !passwordLength || !passwordValid || !passwordConfirmValid ) {
      setIsLoading(false);
      return;
    }

      try {
          const response = await axios.post<RegisterResponse | undefined>("http://localhost:8000/authentication/sendConfirmation", {
              email,
              password,
          });

          if (response?.data) {
              if (response?.data?.token) {
                  console.log("token set successfully: " + response?.data?.token);
                  localStorage.setItem("verification", response?.data?.token);
                  localStorage.setItem("email", email);
                  localStorage.setItem("pass", password);
                  setAlertTitle("Confirmation email");
                  setAlertColor("success");
                  setErrorMessage(response?.data?.message);
                  setIsErrorVisible(true);
              } else {
                  setErrorMessage(response?.data?.message || "An internal server error occured");
                  setIsErrorVisible(true);
              }
              console.log("Send confirmation email was successful: " + response.data.message);
          } else {
              console.log("Send confirmation email failed");
          }
      }
      catch (error: any) {
          console.error("Confirmation email send failed: ", error?.message || error);
          console.log(error.response?.data?.message);
          setErrorMessage(error.response?.data?.message || "An internal server error occured");
          setIsErrorVisible(true);
      }
      setIsLoading(false);
      return;
  }
  return (
    <div className="relative flex flex-col w-full min-h-screen md:flex-row">
      <div className="items-center justify-center hidden h-full overflow-hidden bg-blue-500 md:w-2/5 md:flex ">
        <Chessboard/>
      </div>

      <div className="min-h-screen w-full md:w-3/5 bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center md:shadow-[-10px_0_15px_rgba(0,0,0,0.2)] md:absolute md:right-0 md:z-10">
        <div className="pt-5 text-3xl font-semibold text-center text-stone-700 dark:text-white">
          Welcome to <span className="text-4xl font-bold text-emerald-500">Chess</span>
        </div>
        <Form
          className="min-h-full w-[400px] flex flex-col items-center justify-center gap-y-8 py-20"
        >
          <Input
            label="Email"
            size="md"
            radius="md"
            variant="bordered"
            labelPlacement="inside"
            type="email"
            value={email}
            onValueChange={setEmail}
            isInvalid={emailError || emailLengthError}
            errorMessage={emailLengthError ? "Email must be between 3-64 characters" 
              : emailError
              ? "Invalid email format"
              : undefined
            }
          />
          <Input
            label="Password"
            size="md"
            radius="md"
            variant="bordered"
            labelPlacement="inside"
            type={showPassword ? "text" : "password"}
            value={password}
            onValueChange={setPassword}
            isInvalid={passwordError || passwordLengthError}
            errorMessage={passwordLengthError ? "Password must be between 8-32 characters"
              : passwordError
              ? "Please provide a secure password"
              : undefined
            }
          />
          <Input
            label="Confirm password"
            size="md"
            radius="md"
            variant="bordered"
            labelPlacement="inside"
            type={showPassword ? "text" : "password"}
            value={passwordConfirm}
            onValueChange={setPasswordConfirm}
            isInvalid={passwordConfirmError}
            errorMessage="Passwords don't match"
          />

          <Button
            isLoading={isLoading}
            size="lg"
            radius="lg"
            className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
            onPress={handleSubmit}
          >
            Create an account
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
            href="/login"
            >
            <span className="text-black-200">Already have an account?</span>
          </Link>
          {isErrorVisible &&
           <Alert
           title={alertTitle}
           description={errorMessage}
           isVisible={isErrorVisible}
           onClose={() => setIsErrorVisible(false)}
           radius="md"
           color={alertColor}
           variant="solid"
           >
           </Alert>}
        </Form>
      </div>
    </div>
  );
}

const Chessboard: React.FC = () => {
  const squares = Array(64).fill(null);

  return (
    <div className="absolute top-0 left-0 grid h-full grid-cols-8 grid-rows-8">
      {squares.map((square, index) => {
        const isBlack = (Math.floor(index / 8) + index) % 2 === 1;
        return (
          <div
            key={index}
            className={`aspect-square ${
              isBlack
                ? "bg-stone-700 dark:bg-zinc-800"
                : "bg-zinc-100 dark:bg-zinc-900"
            }`}
          />
        );
      })}
    </div>
  );
};

export default Register;