using System;

namespace DesignPatternsExamples.Factory
{
    // 1. Interfaz común que todos los productos deben implementar
    public interface IVehicle
    {
        void TurnOn();
    }

    // 2. Clases concretas que implementan la interfaz
    public class Car : IVehicle
    {
        public void TurnOn() => Console.WriteLine("El auto está encendido. ¡Brum brum!");
    }

    public class Motorcycle : IVehicle
    {
        public void TurnOn() => Console.WriteLine("La moto está encendida. ¡Run run!");
    }

    // 3. La clase Fábrica (Factory). Su única responsabilidad es crear y retornar los objetos.
    public class VehicleFactory
    {
        public IVehicle CreateVehicle(string type)
        {
            if (type.ToLower() == "car")
                return new Car();
            else if (type.ToLower() == "motorcycle")
                return new Motorcycle();
            else
                throw new ArgumentException("Tipo de vehículo desconocido.");
        }
    }

    class Program
    {
        static void Main()
        {
            // El cliente no usa "new Car()" o "new Motorcycle()". 
            // Solo le pide a la fábrica que lo cree.
            VehicleFactory factory = new VehicleFactory();
            
            IVehicle myVehicle = factory.CreateVehicle("car");
            myVehicle.TurnOn();
        }
    }
}
