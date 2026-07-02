const inputBase =
  'px-2.5 py-1.5 rounded border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand'

export const inputCls = `w-full ${inputBase}`
export const inputInlineCls = `flex-1 ${inputBase}`
export const labelCls = 'text-xs font-medium text-gray-500'

const iconBtnTransition =
  'transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]'

export const iconBtnCls = `p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed ${iconBtnTransition}`
export const iconBtnDangerCls = `p-1.5 rounded text-gray-500 hover:text-red-500 hover:bg-red-50 ${iconBtnTransition}`
