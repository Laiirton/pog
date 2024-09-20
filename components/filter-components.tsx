/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

// Importações necessárias
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

// Interface para as props do componente FilterComponents
interface FilterComponentsProps {
  selectedType: string;
  setSelectedType: React.Dispatch<React.SetStateAction<string>>;
  selectedUser: string;
  setSelectedUser: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  startDate: Date | null;
  setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
  endDate: Date | null;
  setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
  allUsers: string[];
}

// Componente principal de filtros
export function FilterComponentsComponent({
  selectedType,
  setSelectedType,
  selectedUser,
  setSelectedUser,
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  allUsers
}: FilterComponentsProps) {
  // Estados para armazenar o input do usuário, usuários filtrados e visibilidade da lista de usuários
  const [userInput, setUserInput] = useState(selectedUser);
  const [filteredUsers, setFilteredUsers] = useState<string[]>(allUsers);
  const [showUserList, setShowUserList] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);

  // Efeito para filtrar a lista de usuários com base no input do usuário
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

  // Função para selecionar um usuário da lista filtrada
  const handleUserSelect = (user: string) => {
    setSelectedUser(user);
    setUserInput(user);
    setShowUserList(false);
  };

  // Função para lidar com a mudança no input do usuário
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    setSelectedUser(''); // Limpa o usuário selecionado quando o input muda
    setShowUserList(true);
  };

  // Função para limpar o input do usuário
  const clearUserInput = () => {
    setUserInput('');
    setSelectedUser('');
    setFilteredUsers(allUsers);
    setShowUserList(true);
    userInputRef.current?.focus();
  };

  // Efeito para lidar com cliques fora do input de usuário e esconder a lista de usuários
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
      {/* Filtro por tipo */}
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

      {/* Filtro por usuário */}
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

      {/* Filtro por título */}
      <div className="flex flex-col">
        <Label htmlFor="title-input" className="mb-2">Title</Label>
        <Input
          id="title-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-black text-green-500 border border-green-500 w-full"
          placeholder="Search by file name"
        />
      </div>

      {/* Filtro por data */}
      <div className="flex flex-col">
        <Label className="mb-2">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-full justify-start text-left font-normal bg-black text-green-500 border border-green-500`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-black border border-green-500" align="start">
            <Calendar
              mode="single"
              selected={startDate || undefined}  // Garante que a data não seja nula
              onSelect={(day) => setStartDate(day || null)}  // Converte undefined para null
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}