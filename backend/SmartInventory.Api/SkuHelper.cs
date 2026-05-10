using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Api.Data;

namespace SmartInventory.Api;

public static class SkuHelper
{
    public static string GenerateFromName(string name)
    {
        var slug = Regex.Replace(name.Trim().ToUpperInvariant(), @"[^A-Z0-9]+", "-").Trim('-');
        if (string.IsNullOrEmpty(slug))
        {
            slug = "ITEM";
        }

        if (slug.Length > 12)
        {
            slug = slug[..12];
        }

        return $"{slug}-{Random.Shared.Next(100, 1000)}";
    }

    public static async Task<string> EnsureUniqueAsync(ApplicationDbContext db, string candidate)
    {
        var sku = candidate;
        var attempts = 0;
        while (await db.Products.AnyAsync(p => p.Sku == sku) && attempts < 50)
        {
            var lastDash = sku.LastIndexOf('-');
            var basePart = lastDash > 0 ? sku[..lastDash] : sku;
            sku = $"{basePart}-{Random.Shared.Next(1000, 99999)}";
            attempts++;
        }

        return sku;
    }
}
