using System;
using System.Collections.Generic;

namespace DesignPatternsExamples.Observer
{
    // 1. Interfaz del Observador
    public interface ISubscriber
    {
        void Update(string videoTitle);
    }

    // 2. Interfaz del Sujeto (El observable)
    public interface IYouTubeChannel
    {
        void Subscribe(ISubscriber sub);
        void Unsubscribe(ISubscriber sub);
        void NotifySubscribers(string videoTitle);
    }

    // 3. Sujeto concreto
    public class Channel : IYouTubeChannel
    {
        private List<ISubscriber> _subscribers = new List<ISubscriber>();

        public void Subscribe(ISubscriber sub) => _subscribers.Add(sub);
        public void Unsubscribe(ISubscriber sub) => _subscribers.Remove(sub);

        public void NotifySubscribers(string videoTitle)
        {
            foreach (var sub in _subscribers)
            {
                sub.Update(videoTitle);
            }
        }

        public void UploadVideo(string title)
        {
            Console.WriteLine($"\nEl canal subió un nuevo video: {title}");
            NotifySubscribers(title); // Alerta a todos
        }
    }

    // 4. Observadores concretos
    public class User : ISubscriber
    {
        private string _name;

        public User(string name)
        {
            _name = name;
        }

        public void Update(string videoTitle)
        {
            Console.WriteLine($"-> {_name}, hay un nuevo video disponible: '{videoTitle}'");
        }
    }

    class Program
    {
        static void Main()
        {
            Channel techChannel = new Channel();

            User alice = new User("Alice");
            User bob = new User("Bob");

            techChannel.Subscribe(alice);
            techChannel.Subscribe(bob);

            techChannel.UploadVideo("Aprende Patrones de Diseño");
        }
    }
}
