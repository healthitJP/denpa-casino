export default function GoogleLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-56 py-2 border border-gray-300 rounded shadow-sm bg-white hover:bg-gray-100 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 533.5 544.3"
        className="h-5 w-5"
      >
        <path
          fill="#4285F4"
          d="M533.5 278.4c0-18.2-1.6-31.3-5-44.9H272v84.1h146.5c-3 23.2-19.8 58-56.8 81.2l-.5 3.6 82.5 64.1 5.7.6c52.1-48.1 83.1-119 83.1-188.7z"
        />
        <path
          fill="#34A853"
          d="M272 544.3c74.7 0 137.4-24.6 183.2-66.7l-87.4-67.8c-23.5 16-54.9 27-95.8 27-73.5 0-135.8-48.1-158-114.2l-3.3.3-85.5 66.2-1.1 3.2C69.4 486.6 163.3 544.3 272 544.3z"
        />
        <path
          fill="#FBBC05"
          d="M114 322.6c-6-17.8-9.4-36.8-9.4-56.6s3.4-38.8 9.2-56.6l-.2-3.8-86.8-67.2-2.8 1.3C5.1 175.4 0 205.9 0 247.5c0 41.1 5.1 71.4 24.8 105l89.2-70z"
        />
        <path
          fill="#EA4335"
          d="M272 109.1c40.7 0 68 17.5 83.7 32.2l61.1-59.6C381.6 32.5 326.7 0 272 0 163.3 0 69.4 57.7 24.8 142.5l86.2 66.9C136.2 157.2 198.5 109.1 272 109.1z"
        />
      </svg>
      <span className="text-gray-700 font-medium">Google で続行</span>
    </button>
  );
} 