import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import logoImg from '../assets/logoVSNR.png';
import { useNavigate } from 'react-router-dom';

export default function AccessPage() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handles Student Access
  const handleStudentAccess = () => {
    localStorage.setItem('visionari_role', 'student');
    navigate('/dashboard');
  };

  // Handles Officer Sign In
  const handleSignIn = () => {
    if (password === 'Visionari_ISA_27') {
      setError('');
      localStorage.setItem('visionari_role', 'officer');
      navigate('/dashboard');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#890101] to-[#AE510F]">

      {/* =========================================================
          BACKGROUND WHITE VECTOR
          ========================================================= */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{
            filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.28))',
          }}
        >

          {/* =========================
              MOBILE
              Perfectly mapped to match UI mockup 
              (Straight to 50%, wide tangent curve to 75%)
              ========================= */}
          <path
            className="block md:hidden"
            d="
              M 0 0
              H 100
              V 50
              L 65 67.5
              Q 50 75 35 67.5
              L 0 50
              Z
            "
            fill="white"
          />

          {/* =========================
              DESKTOP
              ========================= */}
          <path
            className="hidden md:block"
            d="
              M 0 0
              H 100
              V 30
              L 56 74
              Q 50 80 44 74
              L 0 30
              Z
            "
            fill="white"
          />

        </svg>
      </div>


      {/* =========================================================
          TOP CONTENT
          ========================================================= */}
      <div
        className="
          relative
          z-10
          w-full
          h-[65vh]
          flex
          flex-col
          items-center
          justify-center
          pt-8
        "
      >

        {/* Logo */}
        <div
          className="
            w-[180px]
            h-[180px]
            md:w-[260px]
            md:h-[260px]
            flex
            items-center
            justify-center
            relative
            -left-3
            mb-2
          "
        >
          <img
            src={logoImg}
            alt="Visionari Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Visionari */}
        <h1
          className="
            text-[#A21A0F]
            text-2xl
            md:text-3xl
            font-bold
            tracking-[0.3em]
            mb-1
          "
        >
          VISIONARI
        </h1>

        {/* Section */}
        <p
          className="
            text-gray-700
            text-[11px]
            md:text-sm
            tracking-[0.35em]
            font-medium
            uppercase
          "
        >
          BSIS 4-A
        </p>

      </div>


      {/* =========================================================
          BOTTOM CONTENT
          ========================================================= */}
      <div
        className="
          absolute
          bottom-0
          left-0
          w-full
          h-[25vh]
          z-10
          flex
          flex-col
          items-center
          justify-center
          px-6
          pb-6
        "
      >

        {/* Announcement Button */}
        <button
          className="
            w-full
            max-w-[300px]
            py-3.5
            rounded-full
            border
            border-white/90
            bg-transparent
            text-white
            font-semibold
            tracking-wider
            text-sm
            hover:bg-white/10
            transition-colors
            focus:outline-none
          "
          onClick={handleStudentAccess}
        >
          SEE ANNOUNCEMENT
        </button>

        {/* Officer Link */}
        <p
          className="
            text-white/80
            text-sm
            tracking-wide
            mt-5
            font-light
          "
        >
          Officer?{' '}

          <button
            onClick={() => setIsModalOpen(true)}
            className="
              text-white
              underline
              decoration-1
              underline-offset-4
              hover:text-gray-200
              transition-colors
              focus:outline-none
              font-medium
            "
          >
            Click here.
          </button>
        </p>

      </div>


      {/* =========================================================
          AUTHENTICATION MODAL
          ========================================================= */}
      {isModalOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            backdrop-blur-sm
            p-4
          "
        >

          <div
            className="
              bg-white
              rounded-[2rem]
              shadow-2xl
              w-full
              max-w-sm
              p-8
              flex
              flex-col
              relative
              animate-in
              fade-in
              zoom-in-95
              duration-200
            "
          >

            {/* Close Button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setPassword('');
                setError('');
              }}
              className="
                absolute
                top-5
                right-5
                text-gray-400
                hover:text-gray-600
                transition-colors
              "
            >
              ✕
            </button>


            {/* Modal Header */}
            <div
              className="
                flex
                flex-col
                items-center
                mb-6
                mt-2
              "
            >

              <div
                className="
                  bg-red-50
                  p-4
                  rounded-2xl
                  mb-4
                  text-[#A21A0F]
                "
              >
                <Shield
                  className="w-8 h-8"
                  strokeWidth={2.5}
                />
              </div>

              <h2
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                  mb-1
                "
              >
                Officer Sign In
              </h2>

              <p
                className="
                  text-gray-500
                  text-sm
                  text-center
                  font-medium
                "
              >
                Please verify your identity to continue.
              </p>

            </div>


            {/* Password Field */}
            <div
              className="
                flex
                flex-col
                gap-1
                w-full
                mb-6
              "
            >

              <label
                className="
                  text-gray-700
                  text-sm
                  font-bold
                  ml-1
                "
              >
                Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSignIn();
                    }
                  }}
                  placeholder="Enter administrator password"
                  className={`
                    w-full
                    px-4
                    py-3.5
                    pr-12
                    border
                    rounded-xl
                    text-gray-800
                    placeholder-gray-400
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    ${
                      error
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-red-100 focus:border-[#A21A0F]'
                    }
                  `}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-gray-600
                    focus:outline-none
                  "
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

              {error && (
                <span
                  className="
                    text-[#A21A0F]
                    text-xs
                    font-bold
                    ml-1
                    mt-1
                  "
                >
                  {error}
                </span>
              )}

            </div>


            {/* Modal Buttons */}
            <div
              className="
                flex
                flex-col
                gap-3
                w-full
              "
            >

              <button
                className="
                  w-full
                  py-3.5
                  bg-[#A21A0F]
                  text-white
                  rounded-xl
                  font-bold
                  shadow-md
                  hover:bg-red-800
                  transition-colors
                  active:scale-[0.98]
                "
                onClick={handleSignIn}
              >
                Sign In
              </button>

              <button
                className="
                  w-full
                  py-3.5
                  bg-white
                  text-gray-700
                  border
                  border-gray-200
                  rounded-xl
                  font-bold
                  hover:bg-gray-50
                  transition-colors
                  active:scale-[0.98]
                "
                onClick={() => {
                  setIsModalOpen(false);
                  setPassword('');
                  setError('');
                }}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}