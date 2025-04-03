
/**
 * Utility functions for generating random room locations
 */

// Array of possible floors
const floors = [1, 2, 3];

// Array of possible directions
const directions = ['sağda', 'solda', 'koridorun sonunda', 'merdivenlerden sonra'];

// Array of possible room number ranges
const roomRanges = [
  { min: 101, max: 120 },  // 1st floor
  { min: 201, max: 220 },  // 2nd floor
  { min: 301, max: 320 },  // 3rd floor
];

/**
 * Generates a random integer between min and max (inclusive)
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random room location string
 */
export const getRandomRoomLocation = (): string => {
  const floorIndex = getRandomInt(0, floors.length - 1);
  const floor = floors[floorIndex];
  const direction = directions[getRandomInt(0, directions.length - 1)];
  
  // Get room number based on floor
  const roomRange = roomRanges[floorIndex];
  const roomNumber = getRandomInt(roomRange.min, roomRange.max);
  
  return `Kat ${floor}, ${direction}, Oda ${roomNumber}`;
};
