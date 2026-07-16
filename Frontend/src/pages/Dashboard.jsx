import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function FolderView() {

    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(0);
    const [history, setHistory] = useState([]);
    const [folderName, setFolderName] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchFolders = async (id = currentFolderId) => {
        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            const { data } = await axios.get(`api/folder/fetch/${id}`, {
                headers : {Authorization : `Bearer ${token}`}
            });
            setFolders(data.children);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, [currentFolderId]);

    const createFolder = async (e) => {
        e.preventDefault();

        if (!folderName.trim()) return;

        try {
            const token = localStorage.getItem("accessToken");

            await axios.post("api/folder/create", {
                name: folderName,
                pid: currentFolderId === 0 ? null : currentFolderId
            },{
                headers : {Authorization : `Bearer ${token}`}
            });

            setFolderName("");
            fetchFolders();

        } catch (err) {
            console.error(err);
        }
    };

    const openFolder = (folder) => {
        setHistory(prev => [...prev, folder]);
        setCurrentFolderId(folder.id);
    };

    const goBack = () => {

        const temp = [...history];
        temp.pop();

        setHistory(temp);

        if (temp.length === 0)
            setCurrentFolderId(0);
        else
            setCurrentFolderId(temp[temp.length - 1].id);

    };

    return (
        <div className="max-w-6xl mx-auto p-8">

            <div className="flex justify-between items-center mb-6">

                <div>
                    <h1 className="text-3xl font-bold">
                        CloudBox
                    </h1>

                    <div className="mt-2 text-gray-500">

                        <span
                            className="cursor-pointer"
                            onClick={() => {
                                setCurrentFolderId(0);
                                setHistory([]);
                            }}
                        >
                            Root
                        </span>

                        {
                            history.map(folder => (
                                <span key={folder.id}>
                                    {" / "}
                                    {folder.name}
                                </span>
                            ))
                        }

                    </div>

                </div>

                <form
                    onSubmit={createFolder}
                    className="flex gap-2"
                >

                    <input
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Folder Name"
                        className="border px-3 py-2 rounded"
                    />

                    <button
                        className="bg-blue-600 text-white px-4 rounded"
                    >
                        Create
                    </button>

                </form>

            </div>

            {
                currentFolderId !== 0 &&
                <button
                    onClick={goBack}
                    className="mb-5 text-blue-600"
                >
                    ← Back
                </button>
            }

            {
                loading ?

                    <h2>Loading...</h2>

                    :

                    folders.length === 0 ?

                        <div className="text-center py-20 border rounded">

                            <h2>No folders here.</h2>

                        </div>

                        :

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">

                            {
                                folders.map(folder => (

                                    <div
                                        key={folder.id}
                                        onClick={() => openFolder(folder)}
                                        className="border rounded-lg p-6 cursor-pointer hover:bg-gray-100 text-center"
                                    >

                                        <div className="text-5xl">
                                            📁
                                        </div>

                                        <div className="mt-3">
                                            {folder.name}
                                        </div>

                                    </div>

                                ))
                            }

                        </div>

            }

        </div>
    );

}