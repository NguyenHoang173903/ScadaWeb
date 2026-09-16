using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Application.Realtime;

/// <summary>Accepts Redis tag Value as number | bool | null | numeric-string.</summary>
public sealed class StationRealtimeValueJsonConverter : JsonConverter<object?>
{
    public override object? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Null => null,
            JsonTokenType.Number => reader.TryGetDouble(out var d) ? d : reader.GetDecimal(),
            JsonTokenType.True => true,
            JsonTokenType.False => false,
            JsonTokenType.String => ParseString(reader.GetString()),
            _ => null
        };
    }

    public override void Write(Utf8JsonWriter writer, object? value, JsonSerializerOptions options)
    {
        switch (value)
        {
            case null:
                writer.WriteNullValue();
                break;
            case bool b:
                writer.WriteBooleanValue(b);
                break;
            case byte or sbyte or short or ushort or int or uint or long or ulong or float or double or decimal:
                writer.WriteNumberValue(Convert.ToDouble(value, CultureInfo.InvariantCulture));
                break;
            default:
                writer.WriteStringValue(Convert.ToString(value, CultureInfo.InvariantCulture));
                break;
        }
    }

    private static object? ParseString(string? s)
    {
        if (string.IsNullOrWhiteSpace(s))
            return null;
        if (bool.TryParse(s, out var b))
            return b;
        if (double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
            return d;
        return s;
    }
}
