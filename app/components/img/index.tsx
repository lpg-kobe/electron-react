/**
 * @desc common img com of capture & handle load of image
 */

import React, { useState, useEffect } from 'react';
import { loadImage } from '../../utils/tool';

const Img = (props: any) => {
  const { options, ...attrs } = props;
  const { onComplete, placeImg } = attrs;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // faq? react may have problem to handle onError event of img once it load twice or more by props, so to handle load again if need to update load status
    loadImage(options.src, (status: boolean) => setImgError(!status));
  }, [options.src]);

  /** handle load complete after success or not of img */
  function handleLoad(status: boolean) {
    if (status) {
      onComplete?.(true);
    } else {
      setImgError(true);
      onComplete?.(false);
    }
  }

  return imgError ? (
    placeImg || null
  ) : (
    <img
      {...options}
      onError={() => handleLoad(false)}
      onLoad={() => handleLoad(true)}
    />
  );
};

export default Img;
