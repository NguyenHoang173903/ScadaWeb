using Backend.Application.Common;
using Backend.Infrastructure.Identity;
using Xunit;

namespace Backend.UnitTests;

public class SecurityReportFixesTests
{
    [Theory]
    [InlineData("123456", "admin")]
    [InlineData("Admin@123", "admin")]
    [InlineData("Vasco@123", "Vasco")]
    [InlineData("P@ssw0rd", "operator1")]
    [InlineData("xxAdMiNxx#9", "admin")]
    public void Guessable_passwords_are_rejected(string password, string username)
    {
        Assert.False(PasswordComplexity.TryValidateNotGuessable(password, username, out var error));
        Assert.False(string.IsNullOrEmpty(error));
    }

    [Theory]
    [InlineData("Tr4m-B0m#ApBac", "admin")]
    [InlineData("K7!qzLm2vR", "Vasco")]
    public void Strong_unrelated_passwords_are_accepted(string password, string username)
    {
        Assert.True(PasswordComplexity.TryValidateNotGuessable(password, username, out _));
    }

    [Fact]
    public void Committed_dev_signing_key_is_detected()
    {
        Assert.True(JwtSettings.IsDevelopmentOnlySigningKey("DEV_ONLY_TLN_API_JWT_SIGNING_KEY_AT_LEAST_32_CHARS_LONG!"));
        Assert.False(JwtSettings.IsDevelopmentOnlySigningKey("q9Xr2...production-secret-from-vault-64-chars"));
        Assert.False(JwtSettings.IsDevelopmentOnlySigningKey(null));
    }
}
