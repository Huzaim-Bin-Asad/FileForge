interface ConvertButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function ConvertButton({
  disabled,
  loading,
  onClick,
}: ConvertButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-ember px-6 py-3.5 font-semibold text-white transition hover:bg-ember-deep disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {loading ? "Converting..." : "Convert file"}
    </button>
  );
}
