namespace SmartInventory.Api.Contracts.Products;

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public int CategoryId { get; set; }
}

public class UpdateProductRequest
{
    public string Name { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int CategoryId { get; set; }
}

public class UpdateProductStockRequest
{
    public int QuantityDelta { get; set; }

    public string? Note { get; set; }
}
