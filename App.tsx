import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Play, Clock, Plus, Trash2, Wand2, Image as ImageIcon, Download, Share2 } from 'lucide-react';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import { Button } from './components/Button';
import { TimeDisplay, formatTime } from './components/TimeDisplay';
import { Note } from './types';
import { analyzeFrame, refineNoteText } from './services/geminiService';

const App: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Note Input State
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [activeNoteTimestamp, setActiveNoteTimestamp] = useState<number | null>(null);

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample video if none uploaded (optional, skipping for clean start)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
      setNotes([]); // Reset notes for new video
      setCurrentTime(0);
      setActiveNoteTimestamp(null);
    }
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const seekTo = (time: number) => {
    videoPlayerRef.current?.seekTo(time);
  };

  const captureAndAnalyze = async () => {
    if (!videoPlayerRef.current) return;
    
    setIsProcessingAI(true);
    try {
      // Pause video for better UX
      videoPlayerRef.current.videoElement?.pause();

      const frameBase64 = videoPlayerRef.current.captureFrame();
      if (frameBase64) {
        // Use current time as the timestamp for this new note
        const timestamp = currentTime;
        setActiveNoteTimestamp(timestamp);
        
        const description = await analyzeFrame(frameBase64);
        
        // Add directly or let user edit? Let's fill the input.
        setCurrentNoteText(description);
        
        // Optional: Auto-add toast or notification
      }
    } catch (err) {
      console.error("Failed to analyze frame", err);
      alert("Failed to analyze the frame. Please check your API key.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const refineText = async () => {
    if (!currentNoteText) return;
    setIsProcessingAI(true);
    try {
      const refined = await refineNoteText(currentNoteText);
      setCurrentNoteText(refined);
    } catch (err) {
      alert("Failed to refine text.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const addNote = () => {
    if (!currentNoteText.trim()) return;

    const timestamp = activeNoteTimestamp !== null ? activeNoteTimestamp : currentTime;
    
    // Capture thumbnail if possible
    const thumbnail = videoPlayerRef.current?.captureFrame() || undefined;

    const newNote: Note = {
      id: Date.now().toString(),
      timestamp: timestamp,
      text: currentNoteText,
      thumbnail: thumbnail,
    };

    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
    setCurrentNoteText("");
    setActiveNoteTimestamp(null);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const exportNotes = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `notes-${videoName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  if (!videoSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="bg-indigo-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Play size={40} className="ml-1" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">VideoNote AI</h1>
          <p className="text-gray-400 text-lg">
            Upload a video to start annotating with the power of Gemini AI.
            Capture frames, generate descriptions, and refine your notes instantly.
          </p>
          
          <div className="relative group">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              ref={fileInputRef}
            />
            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-10 transition-colors group-hover:border-indigo-500 group-hover:bg-gray-750">
              <Upload className="w-12 h-12 mx-auto text-gray-400 group-hover:text-indigo-400 mb-4 transition-colors" />
              <p className="text-lg font-medium">Click or drag video file here</p>
              <p className="text-sm text-gray-500 mt-2">MP4, WebM, Ogg supported</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-950 text-gray-100">
      
      {/* LEFT: Video Area */}
      <div className="flex-1 flex flex-col h-[50vh] md:h-full relative border-r border-gray-800">
        <header className="h-14 flex items-center px-4 border-b border-gray-800 bg-gray-900 shrink-0 justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Play size={16} fill="white" />
            </div>
            <h2 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md" title={videoName}>
              {videoName}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            setVideoSrc(null);
            setNotes([]);
          }} className="text-xs">
            Change Video
          </Button>
        </header>

        <div className="flex-1 relative bg-black">
          <VideoPlayer 
            ref={videoPlayerRef}
            src={videoSrc}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={setDuration}
          />
        </div>
        
        {/* Quick controls bar below video (optional addition to native controls) */}
        <div className="h-12 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
             <Clock size={16} />
             <TimeDisplay seconds={currentTime} className="text-white" />
             <span className="text-gray-600">/</span>
             <TimeDisplay seconds={duration} />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportNotes} 
              disabled={notes.length === 0}
              className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              title="Download JSON"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Notes Area */}
      <div className="w-full md:w-[400px] xl:w-[450px] flex flex-col bg-gray-900 h-[50vh] md:h-full z-10 shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-gray-900 z-20">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>Notes</span>
            <span className="text-xs font-normal bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{notes.length}</span>
          </h3>
          
          <div className="space-y-3">
             <div className="flex gap-2">
                <Button 
                   onClick={captureAndAnalyze}
                   disabled={isProcessingAI}
                   className="flex-1 text-xs py-2 bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-900/80"
                   icon={<ImageIcon size={14} />}
                >
                  Analyze Frame
                </Button>
                <div className="flex-1 flex justify-end items-center text-xs text-gray-500">
                  <span className="mr-2">At:</span>
                  <TimeDisplay seconds={activeNoteTimestamp !== null ? activeNoteTimestamp : currentTime} className="bg-gray-800 px-2 py-1 rounded text-white" />
                </div>
             </div>

            <textarea
              value={currentNoteText}
              onChange={(e) => setCurrentNoteText(e.target.value)}
              placeholder="Type your note here..."
              className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-500 text-white"
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={addNote} 
                disabled={!currentNoteText.trim()} 
                className="flex-1"
                icon={<Plus size={16} />}
              >
                Add Note
              </Button>
              <Button 
                onClick={refineText}
                disabled={!currentNoteText.trim() || isProcessingAI}
                variant="secondary"
                title="Refine with AI"
                className="px-3"
              >
                <Wand2 size={16} className={isProcessingAI ? "animate-pulse text-indigo-400" : ""} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p className="mb-2">No notes yet.</p>
              <p className="text-xs">Pause the video and start typing!</p>
            </div>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className="group relative bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-indigo-500/50 rounded-lg p-3 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <button 
                    onClick={() => seekTo(note.timestamp)}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-mono text-sm bg-indigo-900/30 px-2 py-0.5 rounded transition-colors"
                  >
                    <Play size={10} fill="currentColor" />
                    {formatTime(note.timestamp)}
                  </button>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex gap-3">
                   {note.thumbnail && (
                     <div 
                        className="w-16 h-12 bg-black rounded overflow-hidden shrink-0 cursor-pointer border border-gray-700"
                        onClick={() => seekTo(note.timestamp)}
                     >
                       <img src={note.thumbnail} alt="frame" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                     </div>
                   )}
                   <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                     {note.text}
                   </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
