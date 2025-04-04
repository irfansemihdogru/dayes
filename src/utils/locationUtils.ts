
export function getRandomRoomLocation(): string {
  // This function is now deprecated, but kept for backward compatibility
  const floor = Math.floor(Math.random() * 3) + 1;
  const direction = ['sağda', 'solda', 'karşıda', 'koridor sonunda'][Math.floor(Math.random() * 4)];
  const roomNumber = Math.floor(Math.random() * 30) + 1;
  
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

export function getStaffLocationDescription(floor: number, location: string, roomNumber: number): string {
  return `${floor}. kat, ${location}, Oda ${roomNumber}`;
}
