
import ChatWrapper from '@/components/ChatWrapper';
import { ragChat } from '@/lib/rag-chat';
import { redis } from '@/lib/redis';
import { cookies } from 'next/headers';


import React from 'react';


interface PageProps {
    params: {
        // The 'url' parameter can be a string, an array of strings, or undefined
        url: string | string[] | undefined;
    };
}


function reconstructUrl({ url }: { url: string[] }) {
    
    const decodedComponents = url.map((component) => decodeURIComponent(component));
    
    return decodedComponents.join("/");
}


const page = async ({ params }: PageProps) => {
    
    const sessionCookie = cookies().get("sessionId")?.value
   
    const reconstructedUrl = reconstructUrl({ url: params.url as string[] });
    
    const sessionId = (reconstructedUrl + "--" + sessionCookie).replace(/\//g, "")

    const isAlreadyIndexed = await redis.sismember("indexed-urls", reconstructedUrl)
    
     
    const initialMessages = await ragChat.history.getMessages({sessionId})

    if (!isAlreadyIndexed) {
        
        await ragChat.context.add({
            type: "html",
            source: reconstructedUrl,
            config: { chunkOverlap: 50, chunkSize: 200 },
        })

        await redis.sadd("indexed-urls", reconstructedUrl)
    }

    
    return <ChatWrapper sessionId='sessionId' initialMessages={initialMessages}/>
        
            
        
    
}


export default page;