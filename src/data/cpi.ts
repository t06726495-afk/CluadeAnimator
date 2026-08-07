/**
 * CPI-U, annual average, US city average, 1982-84 = 100.
 * Source: U.S. Bureau of Labor Statistics, series CUUR0000SA0.
 * 2025 is a partial-year estimate and is flagged as such in the UI copy.
 */
export const CPI: Record<number, number> = {
  1913: 9.9,
  1920: 20.0,
  1925: 17.5,
  1930: 16.7,
  1935: 13.7,
  1940: 14.0,
  1945: 18.0,
  1946: 19.5,
  1947: 22.3,
  1948: 24.1,
  1949: 23.8,
  1950: 24.1,
  1951: 26.0,
  1952: 26.5,
  1953: 26.7,
  1954: 26.9,
  1955: 26.8,
  1956: 27.2,
  1957: 28.1,
  1958: 28.9,
  1959: 29.1,
  1960: 29.6,
  1961: 29.9,
  1962: 30.2,
  1963: 30.6,
  1964: 31.0,
  1965: 31.5,
  1966: 32.4,
  1967: 33.4,
  1968: 34.8,
  1969: 36.7,
  1970: 38.8,
  1971: 40.5,
  1972: 41.8,
  1973: 44.4,
  1974: 49.3,
  1975: 53.8,
  1976: 56.9,
  1977: 60.6,
  1978: 65.2,
  1979: 72.6,
  1980: 82.4,
  1981: 90.9,
  1982: 96.5,
  1983: 99.6,
  1984: 103.9,
  1985: 107.6,
  1986: 109.6,
  1987: 113.6,
  1988: 118.3,
  1989: 124.0,
  1990: 130.7,
  1991: 136.2,
  1992: 140.3,
  1993: 144.5,
  1994: 148.2,
  1995: 152.4,
  1996: 156.9,
  1997: 160.5,
  1998: 163.0,
  1999: 166.6,
  2000: 172.2,
  2001: 177.1,
  2002: 179.9,
  2003: 184.0,
  2004: 188.9,
  2005: 195.3,
  2006: 201.6,
  2007: 207.3,
  2008: 215.3,
  2009: 214.5,
  2010: 218.1,
  2011: 224.9,
  2012: 229.6,
  2013: 233.0,
  2014: 236.7,
  2015: 237.0,
  2016: 240.0,
  2017: 245.1,
  2018: 251.1,
  2019: 255.7,
  2020: 258.8,
  2021: 271.0,
  2022: 292.7,
  2023: 304.7,
  2024: 313.7,
  2025: 323.0,
}

/** The "today" the bank stamp is quoted in. */
export const CPI_BASE_YEAR = 2025

function cpiFor(year: number): number {
  if (CPI[year] !== undefined) return CPI[year]
  // Fall back to the nearest year we hold, so a stray season never breaks the reveal.
  const years = Object.keys(CPI).map(Number)
  let nearest = years[0]
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(nearest - year)) nearest = y
  }
  return CPI[nearest]
}

/** Convert a nominal figure from `year` into CPI_BASE_YEAR dollars. */
export function inflate(amount: number, year: number): number {
  return amount * (cpiFor(CPI_BASE_YEAR) / cpiFor(year))
}

/** How many times bigger the same dollar figure needs to be today. */
export function inflationMultiple(year: number): number {
  return cpiFor(CPI_BASE_YEAR) / cpiFor(year)
}
