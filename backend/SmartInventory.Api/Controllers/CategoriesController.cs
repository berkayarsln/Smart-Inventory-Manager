using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Api.Contracts.Categories;
using SmartInventory.Api.Data;
using SmartInventory.Api.Models;

namespace SmartInventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll()
    {
        var categories = await dbContext.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories ?? []);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Category>> GetById(int id)
    {
        var category = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<Category>> Create(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Category name is required.");
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Category>> Update(int id, UpdateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Category name is required.");
        }

        var category = await dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        category.Name = request.Name.Trim();
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        await dbContext.SaveChangesAsync();

        return Ok(category);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        var hasProducts = await dbContext.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return BadRequest("Category cannot be deleted while products exist.");
        }

        dbContext.Categories.Remove(category);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
