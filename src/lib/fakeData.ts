
import { Item } from "@/pages/SampleModule";

// Function to generate random data for testing
export const generateFakeData = (count: number): Item[] => {
  const categories = ['Electronics', 'Clothing', 'Home Goods', 'Books', 'Sports', 'Other'];
  const statuses: Array<'active' | 'inactive' | 'discontinued'> = ['active', 'inactive', 'discontinued'];
  
  return Array.from({ length: count }, (_, i) => {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `This is a description for Item ${i + 1}. It provides details about the product.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: parseFloat((Math.random() * 100 + 5).toFixed(2)),
      stock: Math.floor(Math.random() * 100),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastUpdated: randomDate.toISOString().split('T')[0],
    };
  });
};
