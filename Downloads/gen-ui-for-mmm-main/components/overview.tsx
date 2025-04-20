import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { LaunchpadIcon, MessageIcon, VercelIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          {/* <LaunchpadIcon size={32} /> */}

          <Image 
            src="/images/launchpad_icon_l.svg" 
            alt="Launch.ai Logo" 
            width={32} 
            height={32} 
          />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <p>
          Welcome to the Launchpad.ai Data Analyst Assistant. How can I help?
        </p>
        <p>
          You can learn more about Launchpad.ai by visiting {' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://launchpad.ai"
            target="_blank"
          >
            our website
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
