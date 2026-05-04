using System;

namespace DesignPatternsExamples.Adapter
{
    // 1. La interfaz esperada por nuestro sistema (Enchufe Europeo)
    public interface IEuropeanSocket
    {
        void Provide220V();
    }

    // 2. El objeto incompatible (Cargador Americano que necesita 110V)
    public class AmericanCharger
    {
        public void PlugIn110V()
        {
            Console.WriteLine("Cargador americano conectado y recibiendo 110V. Cargando laptop...");
        }
    }

    // 3. El Adaptador: Implementa la interfaz europea pero envuelve el cargador americano
    public class SocketAdapter : IEuropeanSocket
    {
        private AmericanCharger _charger;

        public SocketAdapter(AmericanCharger charger)
        {
            _charger = charger;
        }

        public void Provide220V()
        {
            Console.WriteLine("Adaptador recibiendo 220V, convirtiendo a 110V...");
            // Llama al método del objeto incompatible
            _charger.PlugIn110V();
        }
    }

    class Program
    {
        static void Main()
        {
            AmericanCharger myCharger = new AmericanCharger();
            
            // Pasamos el cargador al adaptador
            IEuropeanSocket socket = new SocketAdapter(myCharger);
            
            // El sistema usa la interfaz que conoce
            socket.Provide220V();
        }
    }
}
