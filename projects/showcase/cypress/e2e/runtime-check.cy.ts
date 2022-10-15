describe('Generic runtime error check', () => {
  [
    'display-map',
    'custom-style-id',
    'satellite-map',
    'add-image-generated',
    'add-image',
    'cluster',
    'heatmap',
    'geojson-line',
    'ngx-geojson-line',
    'custom-marker-icons',
    'ngx-custom-marker-icons',
    'set-popup',
    'fullscreen',
    'navigation',
    'locate-user',
    'attribution-position',
    'ngx-scale-control',
    'interactive-false',
    'center-on-symbol',
    'ngx-drag-a-point',
    'hover-styles',
    'popup-on-click',
    'cluster-html',
    'ngx-cluster-html',
    '3d-buildings',
    'polygon-popup-on-click',
    'add-image-missing-generated',
  ].forEach((route: string) => {
    it(`should display a map without errors for /${route}`, () => {
      cy.visit(`/demo/${route}`);
      cy.get('canvas').should('exist');
      cy.wait(2000);
    });
  });
});
