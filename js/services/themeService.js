'use strict';
angular.module('skynetclient.themeModule', [])
.service('themeService', function() {
  const self = this;
  this.themes = ['default', 'defaultLight', 'choclate', 'choclateLight', 'slate', 'slateLight'];
  this.applyTheme = function(newTheme, scope, updateDB) {
    if (angular.isDefined(newTheme)) {
      scope.theme = {theme:newTheme};
      if (newTheme.indexOf('Light') > -1) {
        scope.theme.background1 = 'A100';
        scope.theme.background2 = '50';
        scope.theme.btnFill = 'black';
      } else {
        scope.theme.background1 = '700';
        scope.theme.background2 = '500';
        scope.theme.btnFill = 'white';
      }
      if (updateDB) updateTheme(newTheme);
    }
  };
  this.applyDefault = function(scope) {
    getTheme().then(function(theme) {
      self.applyTheme(theme || 'defaultLight', scope, false);
    },function(err) {console.log(err)});
  };
})
.provider('themeSet', function UnicornLauncherProvider($mdThemingProvider) {
  $mdThemingProvider.definePalette('defaultPrimary', {
    '50': '#f7f9f9',
    '100': '#545d6e',
    '200': '#49515f',
    '300': '#3e4451',
    '400': '#333842',
    '500': '#282c34',
    '600': '#1d2026',
    '700': '#252930',
    '800': '#23272e',
    '900': '#000000',
    'A100': '#eceff1',
    'A200': '#788297',
    'A400': '#868fa2',
    'A700': '#000000',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': '50 100 200 300 A100'
  });
  $mdThemingProvider.definePalette('choclatePrimary', {
    '50': '#f7f9f9',
    '100': '#d7ccc8',
    '200': '#bcaaa4',
    '300': '#a1887f',
    '400': '#8d6e63',
    '500': '#795548',
    '600': '#6d4c41',
    '700': '#5d4037',
    '800': '#4e342e',
    '900': '#3e2723',
    'A100': '#eceff1',
    'A200': '#bcaaa4',
    'A400': '#8d6e63',
    'A700': '#5d4037',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': '50 100 200 300 A100'
  });
  $mdThemingProvider.definePalette('slatePrimary', {
    '50': '#f7f9f9',
    '100': '#cfd8dc',
    '200': '#b0bec5',
    '300': '#90a4ae',
    '400': '#78909c',
    '500': '#607d8b',
    '600': '#546e7a',
    '700': '#455a64',
    '800': '#37474f',
    '900': '#263238',
    'A100': '#eceff1',
    'A200': '#b0bec5',
    'A400': '#78909c',
    'A700': '#455a64',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': '50 100 200 300 A100'
  });
  $mdThemingProvider.theme('default')
    .primaryPalette('defaultPrimary')
    .warnPalette('deep-orange')
    .accentPalette('teal');
  $mdThemingProvider.theme('defaultLight')
    .primaryPalette('defaultPrimary')
    .warnPalette('deep-orange')
    .accentPalette('teal');
  $mdThemingProvider.theme('choclate')
    .primaryPalette('choclatePrimary')
    .warnPalette('orange')
    .accentPalette('teal');
  $mdThemingProvider.theme('choclateLight')
    .primaryPalette('choclatePrimary')
    .warnPalette('orange')
    .accentPalette('teal');
  $mdThemingProvider.theme('slate')
    .primaryPalette('slatePrimary')
    .warnPalette('yellow')
    .accentPalette('teal');
  $mdThemingProvider.theme('slateLight')
    .primaryPalette('slatePrimary')
    .warnPalette('yellow')
    .accentPalette('teal');

  $mdThemingProvider.theme('error-toast');
  $mdThemingProvider.theme('warning-toast');

  this.$get = [];
});
