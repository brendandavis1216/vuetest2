"use client";

import React from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

interface CreateEventDialogProps {
  onEventCreated: () => void;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ onEventCreated }) => {
  const { supabase, session } = useSupabase();
  const [open, setOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_name: '', // Default value for new field
      artist_name: '',
      budget: 0,
      contact_phone: '',
      hiring_artist: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user.id) {
      showError('You must be logged in to create an event.');
      return;
    }

    const { event_name, event_date, hiring_artist, artist_name, budget, contact_phone } = values;

    const finalArtistName = hiring_artist ? artist_name : null;

    const { error } = await supabase.from('events').insert({
      user_id: session.user.id,
      event_name: event_name || null, // Save event name
      event_date: format(event_date, 'yyyy-MM-dd'),
      artist_name: finalArtistName,
      budget,
      contact_phone,
    });

    if (error) {
      console.error('Error creating event:', error.message);
      showError(`Failed to create event: ${error.message}`);
    } else {
      showSuccess('Event created successfully!');
      form.reset();
      setOpen(false);
      onEventCreated();
    }
  };

  const isHiringArtist = form.watch('hiring_artist');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Your Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details for your upcoming event.
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
                          <> {/* Explicitly wrap children in a fragment */}
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </>
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
              {form.formState.isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;