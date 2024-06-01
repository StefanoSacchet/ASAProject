
export function getByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
      if (value.x === searchValue[0] && value.y === searchValue[1])
        return key;
    }
    return -1;
}