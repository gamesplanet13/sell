import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Sell Your Console | GAMES PLANET',description:'Sell your used PS2, PS3, PS4 or PS5 to Games Planet. Get an estimate, submit photos and track your request securely.',icons:{icon:'/images/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
