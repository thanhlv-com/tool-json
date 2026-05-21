import { useEffect, useId, useState, type ReactNode } from 'react';

type HelpPopupButtonProps = {
  title: string;
  buttonLabel: string;
  buttonClassName?: string;
  children: ReactNode;
};

export function HelpPopupButton({ title, buttonLabel, buttonClassName, children }: HelpPopupButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ??
          'inline-flex items-center justify-center rounded border border-[#C8D2DF] dark:border-[#2D313A] px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-[#334155] dark:text-[#C7CED9] transition-colors hover:border-[#3E4552] hover:text-[#111827] dark:hover:text-white'
        }
      >
        {buttonLabel}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded border border-[#C8D2DF] dark:border-[#2A2D33] bg-[#FFFFFF] dark:bg-[#121214] shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8DEE6] dark:border-[#262626] px-4 py-3">
              <h3 id={dialogTitleId} className="text-xs font-mono uppercase tracking-wide text-[#64748B] dark:text-[#A2AAB8]">
                {title}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded border border-[#C8D2DF] dark:border-[#2D313A] px-2 py-1 text-[10px] font-mono text-[#334155] dark:text-[#C7CED9] transition-colors hover:border-[#3E4552] hover:text-[#111827] dark:hover:text-white"
                aria-label="Close popup"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-4 py-3 text-[11px] font-mono leading-relaxed text-[#8D95A3]">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
