export const fonts = {
  'PlayfairDisplay-Bold': 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD7K3dQYfV7GuSEI6n297oAfJ2Teuv97AZUzZ.ttf',
  'PlayfairDisplay-Regular': 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD7K3dQYfV7GuSEI6n297oAfJ2Teuv97AZUzZ.ttf',
  'Inter-Bold': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.ttf',
  'Inter-Regular': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.ttf',
};

export function getAvailableFonts() {
  return fonts;
}

export type FontName = keyof typeof fonts;
