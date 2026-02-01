const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 
    return emailRegex.test(email);
};
const validateEmailLength = (email: string): boolean => {
    return email.length >= 3 && email.length <= 64; 
};

const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return passwordRegex.test(password) && password.length >= 8;
};

const validatePasswordMatch = (password1: string, password2: string): boolean => {
    return password1 === password2;
}
const validatePasswordLength = (password: string): boolean => {
    return password.length <= 32;
}
export {validateEmail, validatePassword, validatePasswordMatch, validatePasswordLength, validateEmailLength};