import classNames from 'classnames'

const AppDownloadPopover = () => {
  return (
    <div className="relative cursor-pointer rounded-lg border border-gray-200 bg-white text-sm text-[rgba(0,0,0,.7)] shadow-md transition-all">
      <div
        className={classNames(
          'after:absolute after:top-0 after:left-0 after:h-[13px] after:w-full after:-translate-y-full after:bg-transparent after:content-[""]',
        )}
      >
        <div className="h-45 w-45 overflow-clip" />
      </div>
      <div className="flex h-[54.5px] w-[180px] flex-wrap items-center justify-between px-[15px] pb-[5px]">
        <div className="mt-1.25 w-17.5" />
        <div className="mt-1.25 w-17.5" />
        <div className="mt-1.25 w-17.5" />
      </div>
    </div>
  )
}

export default AppDownloadPopover
