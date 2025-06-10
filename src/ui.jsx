const Ui = (props) => {
  return (
    <>
      <div class="min-h-full">
        {/* <nav class="bg-gray-800">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
              <div class="flex items-center">
                <div class="shrink-0">
                  <img class="h-12 w-36" src="https://raw.githubusercontent.com/mbryzek/hackathon/refs/heads/main/assets/bt-cs-logo.png" alt="2025 Bergen Tech Hackathon" />
                </div>
                <div class="md:block hidden">
                  <div class="ml-10 flex items-baseline space-x-4">
                    <a href="/" class="rounded-md px-3 py-2 text-sm font-medium text-white" aria-current="page">Overview</a>
                    <div class="relative group z-50">
                      <a href="/Y25/" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">2025</a>
                      <div class="absolute left-0 top-full w-48">
                        <div class="pt-2 pb-1">
                          <div class="bg-gray-800 rounded-md shadow-lg hidden group-hover:block transition-[display] duration-300 z-[150]">
                            <a href="/Y25/" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Event</a>
                            <a href="/Y25/demos" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Demos</a>
                            <a href="/Y25/photos" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Photos</a>
                            <a href="/Y25/sponsors" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Sponsors</a>
                            <a href="/Y25/prizes" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Prizes</a>
                            <a href="/Y25/rubric" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Rubric</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="relative group z-50">
                      <a href="/Y24/" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">2024</a>
                      <div class="absolute left-0 top-full w-48">
                        <div class="pt-2 pb-1">
                          <div class="bg-gray-800 rounded-md shadow-lg hidden group-hover:block transition-[display] duration-300 z-[150]">
                            <a href="/Y24/" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Event</a>
                            <a href="/Y24/photos" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Photos</a>
                            <a href="/Y24/sponsors" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Sponsors</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <a href="/donate" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white ">Donate</a>
                    <a href="/contact" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white ">Contact</a>
                    <a href="/signup" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 bg-gray-900 hover:text-white ">Register</a>
                  </div>
                </div>
              </div>
              <div class="-mr-2 flex md:hidden">
                <button type="button" class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800" aria-controls="mobile-menu" aria-expanded="false">
                  <span class="absolute -inset-0.5"></span>
                  <span class="sr-only">Open menu</span>
                  <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav> */}
        { ...props.children }
      </div>
    </>
  );
};

export default Ui;
  