const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-[#FFD700] mb-4">CODEBET</h1>
      <p className="text-xl text-gray-300 mb-8">The Ultimate Betting Platform</p>
      <div className="space-x-4">
        <a
          href="/register"
          className="bg-[#FFD700] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#FFD700]/90 transition"
        >
          Get Started
        </a>
        <a
          href="/login"
          className="border border-[#FFD700] text-[#FFD700] px-6 py-3 rounded-md font-semibold hover:bg-[#FFD700]/10 transition"
        >
          Login
        </a>
      </div>
    </div>
  );
};

export default Home;
