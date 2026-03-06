import classNames from 'classnames'

const AppDownloadPopover = () => {
  return (
    <div className='relative cursor-pointer rounded-lg border border-gray-200 bg-white text-sm text-[rgba(0,0,0,.7)] shadow-md transition-all'>
      <div
        className={classNames(
          'after:absolute after:top-0 after:left-0 after:h-[13px] after:w-full after:-translate-y-full after:bg-transparent after:content-[""]'
        )}
      >
        <img
          src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/d91264e165ed6facc6178994d5afae79.png'
          alt='QR_Shopee'
          className='h-45 w-45 overflow-clip'
        />
      </div>
      <div className='flex h-[54.5px] w-[180px] flex-wrap items-center justify-between px-[15px] pb-[5px]'>
        <div className='mt-1.25 w-17.5'>
          <img
            src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/39f189e19764dab688d3850742f13718.png'
            alt='Logo_AppStore'
          />
        </div>
        <div className='mt-1.25 w-17.5'>
          <img
            src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/f4f5426ce757aea491dce94201560583.png'
            alt='Logo_CHPlay'
          />
        </div>
        <div className='mt-1.25 w-17.5'>
          <img
            src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/1ae215920a31f2fc75b00d4ee9ae8551.png'
            alt='Logo_AppGallery'
          />
        </div>
      </div>
    </div>
  )
}

export default AppDownloadPopover
