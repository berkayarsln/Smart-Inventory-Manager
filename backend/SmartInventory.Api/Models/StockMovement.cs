namespace SmartInventory.Api.Models;

public class StockMovement
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public StockMovementKind Kind { get; set; }

    /// <summary>
    /// Change in stock quantity (positive in, negative out / adjustment).
    /// </summary>
    public int QuantityDelta { get; set; }

    public DateTime OccurredAtUtc { get; set; }

    public string? Note { get; set; }

    public Product? Product { get; set; }
}
