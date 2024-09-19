'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, ChevronDown, X } from "lucide-react"
import { format } from "date-fns"

interface FilterComponentsProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  title: string;
  setTitle: (title: string) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  allUsers: string[];
}

export function FilterComponentsComponent({
  selectedType,
  setSelectedType,
  selectedUser,
  setSelectedUser,
  title,
  setTitle,
  date,
  setDate,
  allUsers
}: FilterComponentsProps) {
  const [userInput, setUserInput] = useState(selectedUser);
  const [filteredUsers, setFilteredUsers] = useState<string[]>(allUsers);
  const [showUserList, setShowUserList] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userInput) {
      const filtered = allUsers.filter(user => 
        user.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [userInput, allUsers]);

  const handleUserSelect = (user: string) => {
    setSelectedUser(user);
    setUserInput(user);
    setShowUserList(false);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    setSelectedUser(''); // Clear selected user when input changes
    setShowUserList(true);
  };

  const clearUserInput = () => {
    setUserInput('');
    setSelectedUser('');
    setFilteredUsers(allUsers);
    setShowUserList(true);
    userInputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userInputRef.current && !userInputRef.current.contains(event.target as Node)) {
        setShowUserList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="flex flex-col">
        <Label htmlFor="type-select" className="mb-2">Type</Label>
        <select
          id="type-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-black text-green-500 border border-green-500 rounded p-2 w-full"
        >
          <option value="all">All</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>

      <div className="flex flex-col relative" ref={userInputRef}>
        <Label htmlFor="user-input" className="mb-2">User</Label>
        <div className="relative">
          <Input
            id="user-input"
            type="text"
            value={userInput}
            onChange={handleUserInputChange}
            onFocus={() => setShowUserList(true)}
            className="bg-black text-green-500 border border-green-500 w-full pr-8"
            placeholder="Search user"
          />
          {userInput && (
            <button
              onClick={clearUserInput}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {showUserList && (
          <ul className="absolute z-10 w-full bg-black border border-green-500 mt-2 max-h-40 overflow-y-auto rounded-md top-full">
            {filteredUsers.map((user, index) => (
              <li 
                key={index} 
                className="p-2 hover:bg-green-900 cursor-pointer"
                onClick={() => handleUserSelect(user)}
              >
                {user}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col">
        <Label htmlFor="title-input" className="mb-2">Title</Label>
        <Input
          id="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black text-green-500 border border-green-500 w-full"
          placeholder="Search by file name"
        />
      </div>

      <div className="flex flex-col">
        <Label className="mb-2">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-full justify-start text-left font-normal bg-black text-green-500 border border-green-500`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-black border border-green-500" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}