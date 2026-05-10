namespace SmartInventory.Api.Contracts.Categories;

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
