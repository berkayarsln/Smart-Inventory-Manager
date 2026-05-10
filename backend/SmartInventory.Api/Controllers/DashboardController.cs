using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Api.Data;

namespace SmartInventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<object>> GetSummary([FromQuery] int criticalThreshold = 5)
    {
        if (criticalThreshold < 0)
        {
            return BadRequest("Critical threshold cannot be negative.");
        }

        // SQLite: decimal üzerinde Sum/aggregate sorun çıkarabildiği için önce belleğe alıp topluyoruz.
        var productTotals = await dbContext.Products
            .AsNoTracking()
            .Select(p => new { p.Quantity, p.UnitPrice })
            .ToListAsync();

        var totalProducts = productTotals.Count;
        var totalStockQuantity = productTotals.Sum(p => p.Quantity);
        var totalStockValue = productTotals.Sum(p => (decimal)p.Quantity * p.UnitPrice);

        var criticalProducts = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.Quantity <= criticalThreshold)
            .OrderBy(p => p.Quantity)
            .ThenBy(p => p.Name)
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

        return Ok(new
        {
            totalProducts,
            totalStockQuantity,
            totalStockValue,
            criticalThreshold,
            criticalProducts
        });
    }
}
