export const validateEmail = (email: string) => {
    if (!email) {
        return "Email is required";
    }
    // Basic email format validation - accepts any domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }
    return null;
};

export const validatePassword = (password: string) => {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    if (password.length > 14) {
        return "Password must be at most 14 characters long";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character";
    }
    return null;
};
