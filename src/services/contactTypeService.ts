
import { api } from "@/lib/api";

export interface ContactType {
  ContactTypeID: number;
  ContactTypeCode: string;
  ContactTypeDescription: string;
  RecordStatus: boolean;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

class ContactTypeService {
  async getAll(): Promise<ContactType[]> {
    try {
      const response = await api.get('/api/ContactType');
      return response.data;
    } catch (error) {
      console.error("Error fetching contact types:", error);
      return [];
    }
  }

  async getById(id: number): Promise<ContactType> {
    const response = await api.get(`/api/ContactType/${id}`);
    return response.data;
  }

  async create(data: Omit<ContactType, 'ContactTypeID'>): Promise<ContactType> {
    const response = await api.post('/api/ContactType', data);
    return response.data;
  }

  async update(data: ContactType): Promise<ContactType> {
    const response = await api.put(`/api/ContactType/${data.ContactTypeID}`, data);
    return response.data;
  }

  async delete(id: number): Promise<boolean> {
    await api.delete(`/api/ContactType/${id}`);
    return true;
  }
}

export const contactTypeService = new ContactTypeService();
