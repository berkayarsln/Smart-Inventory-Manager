using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Api.Contracts.Products;
using SmartInventory.Api;
using SmartInventory.Api.Data;
using SmartInventory.Api.Models;

namespace SmartInventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var products = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.Quantity,
                p.UnitPrice,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null
            })
            .ToListAsync();

        return Ok(products ?? []);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetById(int id)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.Quantity,
                p.UnitPrice,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null
            })
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create(CreateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Product name is required.");
        }

        if (request.Quantity < 0)
        {
            return BadRequest("Initial quantity cannot be negative.");
        }

        var categoryExists = await dbContext.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Category not found.");
        }

        var normalizedSku = string.IsNullOrWhiteSpace(request.Sku)
            ? await SkuHelper.EnsureUniqueAsync(dbContext, SkuHelper.GenerateFromName(request.Name.Trim()))
            : request.Sku.Trim();

        var skuExists = await dbContext.Products.AnyAsync(p => p.Sku == normalizedSku);
        if (skuExists)
        {
            return Conflict("SKU already exists.");
        }

        var product = new Product
        {
            Name = request.Name.Trim(),
            Sku = normalizedSku,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            CategoryId = request.CategoryId
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        if (request.Quantity > 0)
        {
            dbContext.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                Kind = StockMovementKind.In,
                QuantityDelta = request.Quantity,
                OccurredAtUtc = DateTime.UtcNow,
                Note = "Initial stock set on product creation."
            });
            await dbContext.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, new
        {
            product.Id,
            product.Name,
            product.Sku,
            product.Quantity,
            product.UnitPrice,
            product.CategoryId
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> Update(int id, UpdateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Product name is required.");
        }

        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        var categoryExists = await dbContext.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Category not found.");
        }

        var normalizedSku = string.IsNullOrWhiteSpace(request.Sku)
            ? await SkuHelper.EnsureUniqueAsync(dbContext, SkuHelper.GenerateFromName(request.Name.Trim()))
            : request.Sku.Trim();

        var skuExists = await dbContext.Products.AnyAsync(p => p.Sku == normalizedSku && p.Id != id);
        if (skuExists)
        {
            return Conflict("SKU already exists.");
        }

        product.Name = request.Name.Trim();
        product.Sku = normalizedSku;
        product.UnitPrice = request.UnitPrice;
        product.CategoryId = request.CategoryId;
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            product.Id,
            product.Name,
            product.Sku,
            product.Quantity,
            product.UnitPrice,
            product.CategoryId
        });
    }

    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult<object>> UpdateStock(int id, UpdateProductStockRequest request)
    {
        if (request.QuantityDelta == 0)
        {
            return BadRequest("QuantityDelta must be non-zero.");
        }

        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        var nextQuantity = product.Quantity + request.QuantityDelta;
        if (nextQuantity < 0)
        {
            return BadRequest("Stock cannot go below zero.");
        }

        product.Quantity = nextQuantity;

        dbContext.StockMovements.Add(new StockMovement
        {
            ProductId = product.Id,
            Kind = request.QuantityDelta > 0 ? StockMovementKind.In : StockMovementKind.Out,
            QuantityDelta = request.QuantityDelta,
            OccurredAtUtc = DateTime.UtcNow,
            Note = string.IsNullOrWhiteSpace(request.Note) ? "Quick stock update." : request.Note.Trim()
        });

        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            product.Id,
            product.Quantity
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
