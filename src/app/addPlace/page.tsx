'use client';
import Link from 'next/link';
import AddPlaceForm from "../components/addPlaceForm";

export default function addPlacePage() {
  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to places
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Add New Place</h1>
      <div className="max-w-lg">
        <AddPlaceForm />
      </div>
    </div>
  );
}