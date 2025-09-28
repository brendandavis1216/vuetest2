"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  event_name: z.string().optional(), // New field for event name/theme
  event_date: z.date({
    required_error: 'Event date is required.',
  }),
  hiring_artist: z.boolean().default(false),
  artist_name: z.string().optional(),
  budget: z.preprocess(
    (val) => Number(val),
    z.number().min(0, {
      message: 'Production budget must be a positive number.',
    })
  ),
  contact_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format.',
  }),
}).superRefine((data, ctx) => {
  if (data.hiring_artist && (!data.artist_name || data.artist_name.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Artist name is required if you are hiring an artist.',
      path: ['artist_name'],
    });
  }
});

interface Event {
  id: string;
  event_name: string | null; // Added event_name
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  created_at: string;
}

interface EditEventDialogProps {
  event: Event;
  onEventUpdated: () => void;
}

const EditEventDialog: React.FC<EditEventDialogProps> = ({ event, onEventUpdated }) => {
  const { supabase, session } = useSupabase();
  const [open, setOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_name: event.event_name || '', // Pre-fill event name
      event_date: new Date(event.event_date),
      hiring_artist: !!event.artist_name,
      artist_name: event.artist_name || '',
      budget: event.budget,
      contact_phone: event.contact_phone,
    },
  });

  // Reset form values when the dialog opens or event prop changes
  useEffect(() => {
    if (open) {
      form.reset({
        event_name: event.event_name || '',
        event_date: new Date(event.event_date),
        hiring_artist: !!event.artist_name,
        artist_name: event.artist_name || '',
        budget: event.budget,
        contact_phone: event.contact_phone,
      });
    }
  }, [open, event, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user.id) {
      showError('You must be logged in to update an event.');
      return;
    }

    const { event_name, event_date, hiring_artist, artist_name, budget, contact_phone } = values;

    const finalArtistName = hiring_artist ? artist_name : null;

    const { error } = await supabase
      .from('events')
      .update({
        event_name: event_name || null, // Update event name
        event_date: format(event_date, 'yyyy-MM-dd'),
        artist_name: finalArtistName,
        budget,
        contact_phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating event:', error.message);
      showError(`Failed to update event: ${error.message}`);
    } else {
      showSuccess('Event updated successfully!');
      setOpen(false);
      onEventUpdated();
    }
  };

  const isHiringArtist = form.watch('hiring_artist');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit Event</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event details here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="event_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name/Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Music Fest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Event</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hiring_artist"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Are you hiring an artist?</FormLabel>
                    <FormDescription>
                      Toggle this if you plan to hire an artist for your event.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isHiringArtist && (
              <FormField
                control={form.control}
                name="artist_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Budget</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        {...field}
                        className="pl-7"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? '' : Number(value));
                        }}
                        value={field.value === 0 ? '' : field.value}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Contact Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., +15551234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Updating...' : 'Update Event'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;