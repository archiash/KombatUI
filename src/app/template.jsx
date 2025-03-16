'use client'
import { motion } from 'framer-motion'
import { useEffect } from 'react';
import {useAppSelector, useSelector} from 'react-redux'
import { selectUser, setUser } from "@/stores/slices/userSlice";
import {  usePathname, useRouter } from 'next/navigation';

const variants = {
  hidden: { opacity: 0, x: 0, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
}


export default function Template({ children }) {
  const pathname = usePathname();
  
  const user = useSelector(selectUser)
  const router = useRouter()
  const available = (pathname === "/" || user !== null)


  useEffect(() => {
    let data = setTimeout(() => {
      if(!available){
        router.push('/')
      }
    }, 0);
    return () => clearTimeout(data);
  }, []);

  return (
    <main>
      <div className="h-screen w-screen fixed noise"/>
    {available && children}
    <motion.div
      className="slide-in z-20"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 0 }}
      exit={{ scaleY: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="slide-out z-20"
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      exit={{ scaleY: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
    
  </main>
  )
}