async function getComponent() {
  var element = document.createElement('div');
  const _ = await
  import ( /* webpackChunkName: "lodash" */ 'lodash');

  element.innerHTML = _.join(['Hello', 'webpack'], ' ');

  return element;
}

getComponent().then(component => {
  document.body.appendChild(component);
});

import UIkit from '../uikit/dis/js/uikit.js';
import Icons from '../uikit/dis/js/uikit-icons';

UIkit.use(Icons);

