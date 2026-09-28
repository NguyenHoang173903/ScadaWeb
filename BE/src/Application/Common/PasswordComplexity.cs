namespace Backend.Application.Common;

/// <summary>
/// Password complexity rules (length + character classes). Bound from
/// <c>Password</c> section alongside expiry options — separate from login lockout
/// and session idle policy.
/// </summary>
public static class PasswordComplexity
{
    public const int DefaultMinLength = 8;
    public const int DefaultMaxLength = 32;

    public static bool TryValidate(
        string? password,
        int minLength,
        int maxLength,
        bool requireUppercase,
        bool requireLowercase,
        bool requireDigit,
        bool requireSpecial,
        out string error)
    {
        if (string.IsNullOrEmpty(password) || password.Length < minLength)
        {
            error = $"Password must be at least {minLength} characters.";
            return false;
        }

        if (password.Length > maxLength)
        {
            error = $"Password must be at most {maxLength} characters.";
            return false;
        }

        if (requireUppercase && !password.Any(char.IsUpper))
        {
            error = "Password must contain at least one uppercase letter.";
            return false;
        }

        if (requireLowercase && !password.Any(char.IsLower))
        {
            error = "Password must contain at least one lowercase letter.";
            return false;
        }

        if (requireDigit && !password.Any(char.IsDigit))
        {
            error = "Password must contain at least one digit.";
            return false;
        }

        if (requireSpecial && !password.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            error = "Password must contain at least one special character.";
            return false;
        }

        error = string.Empty;
        return true;
    }

    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "123456", "1234567", "12345678", "123456789", "1234567890", "111111", "000000",
        "password", "password1", "password1!", "password@123", "p@ssw0rd", "p@ssword1",
        "admin", "admin123", "admin@123", "admin@1234", "administrator", "root", "root@123",
        "qwerty", "qwerty123", "qwerty@123", "abc123", "abc@123", "abcd@1234",
        "welcome1", "welcome@123", "changeme", "letmein", "iloveyou",
        "scada", "scada@123", "scada123", "operator", "operator@123", "user@123", "test@123",
    };

    /// <summary>
    /// Rejects passwords that pass the character-class rules but are still trivially
    /// guessable: well-known leaked passwords or passwords built from the username
    /// (e.g. <c>Vasco/Vasco@123</c>, <c>admin/Admin@123</c>).
    /// </summary>
    public static bool TryValidateNotGuessable(string? password, string? username, out string error)
    {
        var pwd = password ?? string.Empty;
        if (CommonPasswords.Contains(pwd))
        {
            error = "Password is too common. Choose a less predictable password.";
            return false;
        }

        var user = username?.Trim();
        if (!string.IsNullOrEmpty(user) && user.Length >= 3
            && pwd.Contains(user, StringComparison.OrdinalIgnoreCase))
        {
            error = "Password must not contain the username.";
            return false;
        }

        error = string.Empty;
        return true;
    }
}
