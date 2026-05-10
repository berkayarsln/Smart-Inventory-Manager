using Microsoft.EntityFrameworkCore;
using SmartInventory.Api.Models;

namespace SmartInventory.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        if (await db.Categories.AnyAsync())
        {
            return;
        }

        var electronics = new Category
        {
            Name = "Electronics",
            Description = "Sample electronics products"
        };
        var food = new Category
        {
            Name = "Food",
            Description = "Sample food products"
        };
        var office = new Category
        {
            Name = "Office",
            Description = "Sample office supplies"
        };
        var cleaning = new Category
        {
            Name = "Cleaning",
            Description = "Sample cleaning products"
        };

        db.Categories.AddRange(electronics, food, office, cleaning);
        await db.SaveChangesAsync();

        var products = new List<Product>
        {
            new()
            {
                Name = "Wireless Mouse",
                Sku = "SKU-MSE-001",
                Quantity = 12,
                UnitPrice = 349.90m,
                CategoryId = electronics.Id
            },
            new()
            {
                Name = "Mechanical Keyboard",
                Sku = "SKU-KBD-002",
                Quantity = 8,
                UnitPrice = 1899m,
                CategoryId = electronics.Id
            },
            new()
            {
                Name = "USB-C Hub",
                Sku = "SKU-HUB-003",
                Quantity = 15,
                UnitPrice = 649.50m,
                CategoryId = electronics.Id
            },
            new()
            {
                Name = "Ground Coffee 250g",
                Sku = "SKU-COF-101",
                Quantity = 24,
                UnitPrice = 189.90m,
                CategoryId = food.Id
            },
            new()
            {
                Name = "Granola Bar 6-pack",
                Sku = "SKU-SNK-102",
                Quantity = 30,
                UnitPrice = 129m,
                CategoryId = food.Id
            },
            new()
            {
                Name = "Sparkling Water 6-pack",
                Sku = "SKU-DRK-103",
                Quantity = 18,
                UnitPrice = 79.50m,
                CategoryId = food.Id
            },
            new()
            {
                Name = "Notebook A5",
                Sku = "SKU-NBK-201",
                Quantity = 40,
                UnitPrice = 45m,
                CategoryId = office.Id
            },
            new()
            {
                Name = "Pen Set",
                Sku = "SKU-PEN-202",
                Quantity = 3,
                UnitPrice = 129.50m,
                CategoryId = office.Id
            },
            new()
            {
                Name = "Glass Cleaner 750ml",
                Sku = "SKU-CLN-301",
                Quantity = 20,
                UnitPrice = 59.90m,
                CategoryId = cleaning.Id
            },
            new()
            {
                Name = "Microfiber Cloth 3-pack",
                Sku = "SKU-CLN-302",
                Quantity = 14,
                UnitPrice = 39m,
                CategoryId = cleaning.Id
            }
        };

        db.Products.AddRange(products);
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        foreach (var product in products)
        {
            if (product.Quantity <= 0)
            {
                continue;
            }

            db.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                Kind = StockMovementKind.In,
                QuantityDelta = product.Quantity,
                OccurredAtUtc = now,
                Note = "Initial stock from seed data."
            });
        }

        await db.SaveChangesAsync();
    }
}
