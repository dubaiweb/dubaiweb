async function getComponent() {
  var element = document.createElement('div');
  const _ = await
  import ( /* webpackChunkName: "lodash" */ 'lodash');

  element.innerHTML = _.join(['Hello', 'webpack'], ' ');

  return element;
}

import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

UIkit.use(Icons);

var WebFont = require('webfontloader');

WebFont.load({
  google: {
    families: ['Lato:100,300,400,300italic']
  }
});