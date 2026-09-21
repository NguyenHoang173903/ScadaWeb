using Backend.Infrastructure.Identity;
using Microsoft.Extensions.Options;
var hasher = new Argon2idPasswordHasher(Options.Create(new PasswordHashingSettings {
    MemorySize = 65536, Iterations = 3, DegreeOfParallelism = 4, HashLength = 32, SaltLength = 16
}));
Console.WriteLine(hasher.Hash("Admin@123"));
