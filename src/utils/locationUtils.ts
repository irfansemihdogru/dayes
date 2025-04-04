
// Define location templates
const floors = [1, 2, 3];
const directions = ['sağda', 'solda', 'karşıda', 'koridor sonunda'];
const roomNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

export function getRandomRoomLocation(): string {
  const floor = floors[Math.floor(Math.random() * floors.length)];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const roomNumber = roomNumbers[Math.floor(Math.random() * roomNumbers.length)];
  
  return `Kat ${floor}, ${direction}, Oda ${roomNumber}`;
}

export function getDirectionsDescription(location: string): string {
  // Generate a more detailed description for voice guidance
  const parts = location.split(',');
  
  if (parts.length < 3) return location;
  
  const floor = parts[0].trim();
  const direction = parts[1].trim();
  const room = parts[2].trim();
  
  return `${floor} numaralı kata çıkınız. ${direction} yerleştirilmiş ${room} numaralı odaya gidiniz.`;
}
